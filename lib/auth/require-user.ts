// Design Ref: §2.4 접근 제한, §7 "미로그인 사용" — 서버에서 로그인 여부를 다시 확인한다.
// proxy.ts(1차)와 별개로, 모든 route·Server Action 첫 줄에서 이 함수를 쓴다.
// Plan SC: 가입한 사용자만 접근
import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** 로그인한 사용자의 최소 정보 (화면 표시와 권한 확인에 필요한 것만) */
export type AuthUser = {
  id: string;
  email: string | undefined;
};

/**
 * 개발 중에 로그인 기능(PLAN 작업 12) 없이 화면을 시험하기 위한 우회.
 * `next dev`(NODE_ENV=development)에서 DEV_SKIP_LOGIN=true를 직접 설정했을 때만 켜지며,
 * 빌드·배포 환경(NODE_ENV=production)에서는 값을 설정해도 절대 동작하지 않는다.
 */
function isDevLoginSkipped(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_SKIP_LOGIN === "true"
  );
}

/**
 * 로그인한 사용자를 돌려준다. 로그인하지 않았거나 확인할 수 없으면 null.
 * 쿠키 내용을 그대로 믿는 getSession()이 아니라 Supabase 서버에 확인하는 getUser()를 쓴다.
 * 설정이 없거나 확인에 실패하면 "로그인 안 함"으로 처리해 접근을 막는다(fail closed).
 */
export async function requireUser(): Promise<AuthUser | null> {
  if (isDevLoginSkipped()) {
    console.warn("[auth] DEV_SKIP_LOGIN: 개발 모드에서 로그인 검사를 건너뜁니다.");
    return { id: "dev-user", email: undefined };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    console.error("[auth] 로그인 확인 중 오류가 발생했습니다.");
    return null;
  }
}
