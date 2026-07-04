import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Inisialisasi Supabase Server Client untuk membaca cookie session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Ambil data user yang sedang aktif dari session
  const { data: { user } } = await supabase.auth.getUser()

  // JIKA BELUM LOGIN: Tendang langsung ke halaman /masuk
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    // Opsional: berikan parameter ?next= agar setelah login bisa kembali ke halaman terakhir
    url.searchParams.set('next', request.nextUrl.pathname) 
    return NextResponse.redirect(url)
  }

  // Periksa role-nya di tabel public.users jika sudah login
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Blokir akses dan lempar ke halaman Beranda (/) atau /masuk jika bukan siswa
  if (!profile || profile.role !== 'student') {
    const url = request.nextUrl.clone()
    url.pathname = '/' // Atau ganti ke rute khusus /unauthorized jika ada
    return NextResponse.redirect(url)
  }

  return response
}

// Atur halaman yang dapat diakses (Matcher)
export const config = {
  matcher: [
    '/materi/:path*',
  ],
}