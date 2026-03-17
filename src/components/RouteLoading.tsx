interface RouteLoadingProps {
  message?: string;
}

export function RouteLoading({ message = "Cargando información..." }: RouteLoadingProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xs rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center backdrop-blur-sm">
        <div className="mx-auto h-16 w-16 rounded-full border-4 border-gray-700 border-t-red-500 animate-spin" />
        <p className="mt-4 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
