import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Initial Data Load
  useEffect(() => {
    const storedUsers = localStorage.getItem('chat_users_db');
    let parsedUsers: UserProfile[] = [];

    if (storedUsers) {
      try {
        parsedUsers = JSON.parse(storedUsers);
      } catch (e) {
        parsedUsers = [];
      }
    }

    // Ensure Owner Account exists (Background check)
    const ownerAccount: UserProfile = {
      username: 'Nice222',
      password: '1175',
      name: 'คุณไนซ์ (CEO)',
      avatar: '👑' 
    };

    const ownerIndex = parsedUsers.findIndex(u => u.username === ownerAccount.username);
    if (ownerIndex === -1) {
      parsedUsers.unshift(ownerAccount);
      localStorage.setItem('chat_users_db', JSON.stringify(parsedUsers));
    } else {
        // Keep owner password synced
        if (parsedUsers[ownerIndex].password !== ownerAccount.password) {
            parsedUsers[ownerIndex] = ownerAccount;
            localStorage.setItem('chat_users_db', JSON.stringify(parsedUsers));
        }
    }

    setUsers(parsedUsers);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !name) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (users.some(u => u.username === username)) {
      setError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      return;
    }
    
    // Prevent registering as Nice222 manually
    if (username.toLowerCase() === 'nice222') {
        setError('ชื่อผู้ใช้นี้สงวนสิทธิ์');
        return;
    }

    const newUser: UserProfile = {
      username,
      password,
      name,
      avatar: '👤' // Default minimalist avatar
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('chat_users_db', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-kanit">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-green-500/30 text-white text-3xl">
                IA
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                {isRegistering ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับ'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
                {isRegistering ? 'กรอกข้อมูลเพื่อเริ่มต้นใช้งาน' : 'กรอกข้อมูลเพื่อเข้าสู่ระบบ'}
            </p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl mb-6 text-center border border-red-100">
                {error}
            </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          
          {isRegistering && (
            <div className="group">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">ชื่อที่ใช้แสดง</label>
                <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                    placeholder="เช่น สมชาย ใจดี"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
          )}

          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-800 placeholder-gray-400"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-800 placeholder-gray-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-[0.98] mt-2"
          >
            {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm">
                {isRegistering ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
                <button 
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                        setUsername('');
                        setPassword('');
                        setName('');
                    }}
                    className="ml-2 text-green-600 font-bold hover:text-green-700 hover:underline focus:outline-none transition-colors"
                >
                    {isRegistering ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;