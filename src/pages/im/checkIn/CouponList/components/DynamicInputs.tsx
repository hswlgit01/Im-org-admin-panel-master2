import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useDynamicList } from 'ahooks';
import { Input } from 'antd';
import { useEffect } from 'react';

const DynamicInputs = ({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
}) => {
  const { list, remove, getKey, insert, replace, resetList } = useDynamicList(value);

  useEffect(() => {
    // If value change manual, reset list
    if (value !== list) {
      resetList(value);
    }
  }, [value]);

  useEffect(() => {
    onChange?.(list);
  }, [list]);

  const Row = (index: number, item: any) => (
    <div key={getKey(index)} style={{ marginBottom: 16 }}>
      <Input
        style={{ width: 300 }}
        placeholder="Please enter name"
        onChange={(e) => replace(index, e.target.value)}
        value={item}
      />

      {list.length > 1 && (
        <MinusCircleOutlined
          style={{ marginLeft: 8 }}
          onClick={() => {
            remove(index);
          }}
        />
      )}
      <PlusCircleOutlined
        style={{ marginLeft: 8 }}
        onClick={() => {
          insert(index + 1, '');
        }}
      />
    </div>
  );

  return <>{list.map((ele, index) => Row(index, ele))}</>;
};

export default DynamicInputs;
