const Footer = () => {
  return (
    <footer className="bg-white w-full py-6 mt-auto border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-600 font-medium">
            © 2024 TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a 
              href="#" 
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Website Nhà Trường
            </a>
            <span className="text-gray-300">|</span>
            <a 
              href="#" 
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Cổng thông tin sinh viên
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
