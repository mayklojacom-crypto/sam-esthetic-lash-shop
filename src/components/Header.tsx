import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-lg bg-opacity-95">
      <div className="flex items-center justify-center h-14 px-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src="/logo.png" alt="Sam Esthetic" className="h-9 w-auto" />
        </button>
      </div>
    </header>
  );
};

export default Header;
