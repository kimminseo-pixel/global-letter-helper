// Design Ref: §2.4 접근 제한, §7 "미로그인 사용" — 서버에서 로그인 여부를 다시 확인한다.
// proxy.ts(1차)와 별개로, 모든 route·Server Action 첫 줄에서 이 함수를 쓴다.
// Plan SC: 가입한 사용자만 접근
import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 로그인한 사용자를 돌려준다. 로그인하지 않았거나 확인할 수 없으면 null.
 * 쿠키 내용을 그대로 믿는 getSession()이 아니라 Supabase 서버에 확인하는 getUser()를 쓴다.
 * 설정이 없거나 확인에 실패하면 "로그인 안 함"으로 처리해 접근을 막는다(fail closed).
 */
export async function requireUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    console.error("[auth] 로그인 확인 중 오류가 발생했습니다.");
    return null;
  }
}
