// Design Ref: §3.2 환경변수, §6 폴더 구조 — 서버용 Supabase 클라이언트 (브라우저용 클라이언트는 만들지 않는다)
import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 요청 쿠키를 읽는 서버용 Supabase 클라이언트를 만든다.
 * SUPABASE_URL·SUPABASE_ANON_KEY가 없으면 null을 돌려준다(호출한 쪽에서 접근을 막는다).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error("[auth] SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.");
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 쿠키를 쓸 수 없는 위치(서버 컴포넌트 렌더링)에서는 무시한다.
        }
      },
    },
  });
}
