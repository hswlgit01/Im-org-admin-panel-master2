import {
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';

export default () => {

  
    const formLabel = (label: string) => <h3>{label}</h3>;
  return (
    <div style={{ paddingTop: 20 }}>
      <ProForm
        layout='horizontal'
        labelCol={{
            span: 4,
            offset: 0,
            style: { 
                fontSize: '18px',
             },
        }}
        size="large"
        labelAlign="left"
        formKey="base-form-use-demo"
        readonly={true}
        submitter={false}
        initialValues={{
            max: '发行币种可配置，系统默认100000',
            min: '发行币种可配置，系统默认0',
            maxNum: '系统默认1000',
            expireTime: '24小时',
            allowPrivateChat: '角色管理可配置功能',
            dailyLimit: '无限制'
        }}
      >
       <ProFormText name="max" label={formLabel("红包最大金额")}/>
       <ProFormText name="min" label={formLabel("红包最小金额")}/>
       <ProFormText name="maxNum" label={formLabel("红包最大个数")}/>
       <ProFormText name="expireTime" label={formLabel("红包过期时间")}/>
       <ProFormText name="allowPrivateChat" label={formLabel("是否允许私聊红包")}/>
       <ProFormText name="dailyLimit" label={formLabel("每日领取红包个数限制")}/>
      </ProForm>
    </div>
  );
};