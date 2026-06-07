export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold text-primary">OpenCRM AI</div>
          <p className="text-sm text-muted-foreground">Revenue Operations platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
