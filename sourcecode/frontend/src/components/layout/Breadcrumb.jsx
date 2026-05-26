import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <div className="bg-surface-container-lowest border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-margin py-3">
        <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 uppercase">
          {items.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              )}
              {item.path ? (
                <Link to={item.path} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-on-surface">{item.label}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default Breadcrumb;
