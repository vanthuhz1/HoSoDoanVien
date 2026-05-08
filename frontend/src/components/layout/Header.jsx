const Header = () => {
  return (
    <header 
      className="relative overflow-hidden text-white" 
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://lh3.googleusercontent.com/aida/ADBb0ugm3CVhh7jI1_eavwqQZMwKgc4NDjWhzgRW7zs-Vov_A8GGW0sCCq6xYKl_ZQwJdnRoYqShmOqWe86vcho-xs64p2ZIVn6sEojit6N0vVL7QIXKkUNl_qZL10PURse7dtI-zHk3UqplLvo86ZtP0ca_ehjsJVhiGxHDbaRlT4rNA12IM5ik5dov4wRcObLSoYldLo421TJcSTQI--IG2tRz85JxWxZ04msrN0OxYNlUedOAuNj4GpgYk0IPoavxo8sDp8nOs_st")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
            <span className="material-symbols-outlined text-4xl text-white">school</span>
          </div>
          <div className="flex flex-col gap-1">
            
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
