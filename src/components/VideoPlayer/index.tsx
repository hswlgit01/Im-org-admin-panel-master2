import { Modal } from 'antd';
import { useModel } from '@umijs/max';
import { memo, useEffect } from 'react';
import { I18N, SimplePlayer } from 'xgplayer';

import EN from 'xgplayer/es/lang/en';
import Error from 'xgplayer/es/plugins/error';
import Mobile from 'xgplayer/es/plugins/mobile';
import PC from 'xgplayer/es/plugins/pc';
import Play from 'xgplayer/es/plugins/play';
import Progress from 'xgplayer/es/plugins/progress';
import Start from 'xgplayer/es/plugins/start';
import Time from 'xgplayer/es/plugins/time';

import 'xgplayer/dist/xgplayer.css';

I18N.use(EN);

const VideoPlayerModal = () => {
  const { initialState, setInitialState } = useModel('@@initialState');

  useEffect(() => {
    if (!!initialState?.videoUrl) {
      new SimplePlayer({
        id: 'video_player',
        url: initialState?.videoUrl,
        plugins: [Start, PC, Mobile, Progress, Play, Time, Error],
      });
    }
  }, [initialState?.videoUrl]);

  const onCancel = () => {
    setInitialState((s: any) => ({
      ...s,
      videoUrl: '',
    }));
  };

  return (
    <Modal
      title={null}
      footer={null}
      open={!!initialState?.videoUrl}
      centered
      onCancel={onCancel}
      styles={{
        mask: {
          opacity: 0,
          transition: 'none',
        },
      }}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <div id="video_player"></div>
    </Modal>
  );
};

export default memo(VideoPlayerModal);
