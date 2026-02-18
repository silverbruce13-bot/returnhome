import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../i18n';
import Card from './common/Card';

const Auth: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: '가입 완료! 이메일을 확인해주세요.' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.error_description || error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md p-8 bg-slate-800/80 backdrop-blur-xl border border-sky-500/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isSignUp ? '회원가입' : '돌아오신 것을 환영합니다'}
                    </h2>
                    <p className="text-sky-200/60 text-sm">
                        {isSignUp ? '묵상 공동체에 참여하세요' : '로그인하여 묵상을 이어가세요'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1 px-1">이메일</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1 px-1">비밀번호</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                            required
                            minLength={6}
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/40 transition-all transform active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
                    >
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Auth;
