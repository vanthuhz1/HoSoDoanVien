const Footer = () => {
  return (
    <footer className="bg-surface-container w-full py-6 mt-auto border-t border-outline-variant flex flex-col items-center justify-center gap-2 px-margin text-center">
      <p className="font-label-md text-on-surface-variant text-label-md uppercase opacity-90 hover:opacity-100 transition-opacity">
        © 2024 TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
          Website Nhà Trường
        </a>
        <span className="text-outline-variant hidden sm:inline">|</span>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
          Cổng thông tin sinh viên
        </a>
      </div>
    </footer>
  );
};

export default Footer;
