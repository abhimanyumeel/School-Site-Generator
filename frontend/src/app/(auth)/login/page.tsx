import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-gray-300 to-purple-400">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/95 p-8 rounded-xl shadow-lg">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Welcome back</h2>
            <p className="text-gray-600 mt-2">Please sign in to your account</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}