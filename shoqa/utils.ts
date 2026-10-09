
export const toPersianDigits = (n: string | number | undefined): string => {
  if (n === undefined || n === null || n === "") return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};
