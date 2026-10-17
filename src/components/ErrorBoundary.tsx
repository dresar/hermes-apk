import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    void _error
    void _errorInfo
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#090a0b] px-6 text-center text-[#f3f4f6]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#23262d] bg-[#121316] text-[#ff6347]">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-[#f3f4f6]">
            Terjadi Kendala
          </h1>
          <p className="mt-1.5 max-w-xs text-xs text-[#9ca3af]">
            Aplikasi mengalami kendala saat memuat antarmuka. Silakan muat ulang untuk melanjutkan.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 flex min-h-[44px] items-center justify-center rounded-xl bg-[#ff6347] px-6 py-2.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 active:scale-95"
          >
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
