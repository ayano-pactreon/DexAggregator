import { SVGProps } from "react";

const XLogo = ({ fill = "#8993B1", ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    {...props}
  >
      <path
        fill={fill}
        fillRule="evenodd"
        d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm5.4-17.521h-1.963l-3.233 3.68-2.796-3.68h-4.05l4.839 6.3-4.586 5.217h1.964l3.54-4.026 3.092 4.026h3.95l-5.044-6.638 4.287-4.88Zm-1.563 10.348h-1.088l-7.1-9.24h1.168l7.02 9.24Z"
        clipRule="evenodd"
      />
  </svg>
);
export default XLogo;
