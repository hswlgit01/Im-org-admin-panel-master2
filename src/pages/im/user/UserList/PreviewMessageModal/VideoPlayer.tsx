import { Modal } from 'antd';
import ReactPlayer from 'react-player';

function VideoPlayer({ closeModal, playUrl }: { closeModal: () => void; playUrl: string }) {
  return (
    <Modal
      destroyOnClose
      centered
      title={null}
      styles={{
        body: { padding: 0 },
      }}
      footer={null}
      open
      onCancel={closeModal}
    >
      <ReactPlayer className=" " width={'400'} height={'auto'} controls url={playUrl} playing />
    </Modal>
  );
}

export default VideoPlayer;
