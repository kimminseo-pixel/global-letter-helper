// 로그인이 없는 서비스에서 AI 호출 비용이 무제한으로 늘지 않도록 접속자별 호출 횟수를 제한한다.
// 서버 메모리에만 기록하므로 서버가 재시작되거나 여러 인스턴스로 나뉘면 초기화된다(완전한 방어는 아님).
import "server-only";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const MAX_TRACKED_KEYS = 5_000;

const hits = new Map<string, number[]>();

/** 접속자를 구분하는 키. 프록시가 붙여 주는 클라이언트 주소를 쓰고, 없으면 하나로 묶는다. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

/** 1분에 8회까지 허용한다. 초과하면 false. */
export function allowRequest(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // 기록이 너무 많이 쌓이지 않도록 오래된 접속자를 정리한다.
  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return true;
}
