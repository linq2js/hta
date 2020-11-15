import { useRouter } from "./context";

export default function useMatch() {
  let router = useRouter();
  return router && router.match;
}
