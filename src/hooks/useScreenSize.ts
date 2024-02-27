import { useEffect, useState } from "react";

type PropsType = {
  mobileSize?: number;
  largeSize?: number;
};

const mobileSize = 900;
const largeSize = 1440;
const defaultOptions = { mobileSize, largeSize };

export default function useScreenSize(propOptions: PropsType = defaultOptions) {
  const [viewType, setViewType] = useState({
    size: "normal",
    mobile: false,
  });
  const [screenWidth, setScreenWidth] = useState<number>();
  const [screenHeight, setScreenHeight] = useState<number>();

  const checkSize = () => {
    const options = { ...defaultOptions, ...propOptions };
    const width = window.innerWidth;
    setScreenWidth(width);
    const height = window.innerHeight;
    setScreenHeight(height);
    const isMobile = width < options.mobileSize;
    const size = isMobile
      ? "small"
      : width >= options.largeSize
      ? "large"
      : "normal";
    setViewType((prevView) =>
      !prevView?.size || prevView.size !== size
        ? {
            size,
            mobile: isMobile,
          }
        : prevView
    );
  };

  useEffect(() => {
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  return { viewType, screenWidth, screenHeight };
}
