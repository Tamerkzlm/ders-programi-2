// frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary yakaladı:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleResetStorage = () => {
    if (window.confirm('Bu işlem tarayıcıda saklanan yerel verileri sıfırlayacaktır. Devam etmek istiyor musunuz?')) {
      try {
        localStorage.removeItem('hz-ayse-timetable-v1');
      } catch (e) {
        console.error(e);
      }
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Beklenmeyen Bir Sorun Oluştu
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Uygulama çalışırken beklenmeyen bir arayüz hatası meydana geldi. Aşağıdaki seçenekleri kullanarak çalışmaya devam edebilirsiniz.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-950/60 rounded-xl text-left border border-slate-800">
                <p className="text-xs font-mono text-rose-300 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Sayfayı Yenile
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Ana Portala Dön
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Bozuk Veriyi Sıfırla ve Yeniden Başlat
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
