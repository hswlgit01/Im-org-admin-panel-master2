import { splitUpload } from '@/services/upload';
import { PageContainer } from '@ant-design/pro-components';
import { useLocation, history } from '@umijs/max';
import { Button, Input, message, Space } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { insertArticle, selectArticleDetail, updateArticle } from '@/services/notification';

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'formula'],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
  [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
  [{ direction: 'rtl' }], // text direction

  [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ['clean'], // remove formatting button
];

const ArticleDetail = () => {
  const location = useLocation();
  const quillRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('');

  // 标准化保存前的HTML内容，处理图片URL
  const normalizeContentForSave = (htmlContent: string) => {
    if (!htmlContent) return '';

    // 将带有域名的完整URL转换为相对路径
    const originRegex = new RegExp(`${window.location.origin}/object/`, 'g');
    return htmlContent.replace(originRegex, '/object/');
  };

  const save = async (type: 'draft' | 'published') => {
    console.log('value: ', value);
    if (!title) {
      message.warning('请输入文章标题');
      return;
    }
    if (!value && location.state.id === '0') {
      message.warning('请输入文章内容');
      return;
    }

    // 标准化HTML内容中的图片URL
    const normalizedContent = normalizeContentForSave(value);

    const params = {
      title: title,
      content: normalizedContent,
      status: type,
    }
    let res;
    if (location.state && location.state.id !== '0') {
      params.id = location.state.id;
      res = await updateArticle(params);
    } else {
      res = await insertArticle(params);
    }
    if (res.errCode === 0) {
      message.success('操作成功');
      history.push('/im/notification/article_list');
    }
  };
  useEffect(() => {
    const editorDom = quillRef.current?.editor?.root;
    const handlePaste = async (e) => {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.startsWith('image')) {
          e.preventDefault();
          const { url: imageUrl } = await splitUpload(item.getAsFile());
          insertToEditor(imageUrl);
        }
      }
    };
    editorDom?.addEventListener('paste', handlePaste);
    return () => editorDom?.removeEventListener('paste', handlePaste);
  }, []);
  const replaceImgDomain = (htmlText: string)=> {
    if (!htmlText) return '';

    // 处理包含完整URL路径的图片标签
    const regex1 = /<img\s+[^>]*src="([^"]*\/api\/object\/[^"]+)"[^>]*>/gi;
    let processedHtml = htmlText.replace(regex1, (match, srcValue) => {
      // 提取原 URL 的路径部分（保留协议、端口、路径等）
      try {
        const url = new URL(srcValue);
        const newSrc = `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
        // 重构 <img> 标签并替换 src
        return match.replace(srcValue, newSrc);
      } catch (e) {
        console.error('Error parsing URL:', srcValue, e);
        return match;
      }
    });

    // 处理只包含相对路径且没有/object/前缀的图片标签
    const regex2 = /<img\s+[^>]*src="([^"\/][^"]*\.(jpg|jpeg|png|gif|webp))"[^>]*>/gi;
    processedHtml = processedHtml.replace(regex2, (match, srcValue) => {
      // 如果路径不包含/object/，添加该前缀
      if (!srcValue.includes('/object/')) {
        const newSrc = `${window.location.origin}/object/${srcValue}`;
        return match.replace(srcValue, newSrc);
      }
      return match;
    });

    return processedHtml;
  }
  useEffect(()=>{
    if (location.state.id !== '0') {
      selectArticleDetail(location.state.id).then(res=>{
        console.log('res',res);
        if (res.errCode === 0) {
          const ht = replaceImgDomain(res.data.content);
          console.log('ht: ', ht);
          console.log('res.data.content: ', res.data.content);
          setTitle(res.data.title);
          // 使用处理后的HTML内容
          setValue(ht);
          setLoading(false)
        }
      });
    } else {
      setLoading(false);
    }
  }, [location.state.id]);

  const insertToEditor = (url: string) => {
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();

    // 确保URL包含正确的前缀
    let fullUrl = url;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      // 如果是纯相对路径（例如：47618822595889945106/compressed-image.jpg）
      fullUrl = `${window.location.origin}/object/${url}`;
    } else if (url.startsWith('/')) {
      // 如果是以/开头但不完整的路径
      fullUrl = `${window.location.origin}${url}`;
    }

    quill.insertEmbed(range.index, 'image', fullUrl);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      const { url: imageUrl } = await splitUpload(file);
      console.log('imageUrl: ', imageUrl);
      insertToEditor(imageUrl);
    };
  };

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: handleImageUpload, // 图片上传
        },
      },
    };
  }, []);

  return (
    <PageContainer loading={loading}>
      <div style={{ marginBottom: 30 }}>
        文章标题：
        <Input
          style={{ width: 600 }}
          showCount
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <ReactQuill
        key="123"
        style={{
          height: '70vh',
        }}
        modules={modules}
        theme="snow"
        ref={quillRef}
        value={value}
        onChange={setValue}
      />
      <Space style={{ position: 'absolute', right: 40, top: -55 }}>
        <Button type="primary" onClick={() => save('draft')}>
          保存草稿
        </Button>
        <Button type="primary" onClick={() => save('published')}>
          发布
        </Button>
      </Space>
    </PageContainer>
  );
};

export default ArticleDetail;
