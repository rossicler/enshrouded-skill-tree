import { ClassNameValue, twMerge } from "tailwind-merge";

export const classNames = (...classes: ClassNameValue[]) => {
  return twMerge(classes);
};
