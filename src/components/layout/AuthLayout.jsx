import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      <div className="absolute top-[20%] right-[-10%] w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      <Outlet />
    </div>
  );
}
