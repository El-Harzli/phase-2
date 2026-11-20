import Spinner from "@/shared/components/Spinner";

export default function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary-500">
      <Spinner />
    </div>
  );
}
