import { Modal, Space, Table } from "antd";

interface IErrorDataModalProps {
    visible: boolean;
    closeModal: () => void;
    errorData: any[];
}
const err_type_map = {
    system: '系统错误',
    ExcelFormat: 'excel格式错误',
    AccountRegexp: '账号格式错误',
    MissingPwd: '密码为空',
    MissingNickname: '昵称为空',
    AccountAlreadyExist: '账号已存在',
};
const ErrorDataModal: React.FC<IErrorDataModalProps> = (props) => {
    const { visible, closeModal, errorData } = props;

    const columns = [
        { title: '错误行数', key: 'row', dataIndex: 'row' },
        {
            title: '错误行信息',
            key: 'rowInfo',
            dataIndex: 'rowInfo',
            render: (_, record) => (
                <Space direction="vertical">
                    <div>账户：{record.data.account}</div>
                    <div>昵称：{record.data.nickname}</div>
                </Space>
            )
        },
        {
            title: '失败原因',
            key: 'type',
            dataIndex: 'type',
            render: (type) => (err_type_map[type])
        },
    ];
    return (
        <Modal title="导入失败" open={visible} onCancel={closeModal} onOk={closeModal}>
            <Table dataSource={errorData} columns={columns} />
        </Modal>
    )
};

export default ErrorDataModal;