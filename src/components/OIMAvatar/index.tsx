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

  const resolvedAvatarUrl = useMemo(() => getResourceUrl(getAvatarUrl), [getAvatarUrl]);

  const avatarProps = { ...props, isgroup: undefined, isnotification: undefined };

  useEffect(() => {
    setErrorHolder(undefined);
  }, [resolvedAvatarUrl]);

  const errorHandler = () => {
    if (isgroup) {
      setErrorHolder(default_group);
    }
    return false;
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
      // dawn 2026-06-15 修复群头像加载失败仍显示破图：内部 Image 失败时主动回退到默认群头像。
      src={
        errorHolder ??
        (resolvedAvatarUrl ? (
          <Image preview={preview} src={resolvedAvatarUrl} onError={errorHandler as any} />
        ) : undefined)
      }
      onError={errorHandler as any}
    >
      {text?.split('')[0]}
    </AntdAvatar>
  );
};

export default OIMAvatar;
