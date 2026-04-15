import { Avatar as AntdAvatar, AvatarProps, Image } from "antd";
import clsx from "clsx";
import { FC, useEffect, useMemo, useState } from "react";

import default_group from "@/assets/images/group.png";
import { getResourceUrl } from "@/utils/common";

interface IOIMAvatarProps extends AvatarProps {
  text?: string;
  color?: string;
  bgColor?: string;
  isgroup?: boolean;
  isnotification?: boolean;
  size?: number;
  preview?: boolean;
}

const OIMAvatar: FC<IOIMAvatarProps> = (props) => {
  const {
    src,
    text,
    size = 35,
    color = "#fff",
    bgColor = "#2074de",
    isgroup = false,
    isnotification,
    preview = true,
  } = props;
  const [errorHolder, setErrorHolder] = useState<string>();

  const getAvatarUrl = useMemo(() => {
    if (src) {
      return src;
    }
    return isgroup ? default_group : undefined;
  }, [src, isgroup, isnotification]);

  const avatarProps = { ...props, isgroup: undefined, isnotification: undefined };

  useEffect(() => {
    if (!isgroup) {
      setErrorHolder(undefined);
    }
  }, [isgroup]);

  const errorHandler = () => {
    if (isgroup) {
      setErrorHolder(default_group);
    }
  };

  return (
    <AntdAvatar
      style={{
        backgroundColor: bgColor,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        lineHeight: `${size - 2}px`,
        color,
      }}
      shape="square"
      {...avatarProps}
      className={clsx(
        {
          "cursor-pointer": Boolean(props.onClick),
        },
        props.className,
      )}
      src={errorHolder ?? <Image preview={preview} src={getResourceUrl(getAvatarUrl)} />}
      onError={errorHandler as any}
    >
      {text?.split('')[0]}
    </AntdAvatar>
  );
};

export default OIMAvatar;
