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

  const pathname = request.nextUrl.pathname;

  // Jika belum login, lempar ke halaman /masuk
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Periksa role-nya di tabel public.users jika sudah login
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Blokir akses ke halaman materi dan lempar ke halaman Beranda (/) jika bukan siswa
  if(pathname.startsWith('/materi')) {
    if (!profile || profile.role !== 'student') {
      const url = request.nextUrl.clone()
      if(profile?.role === 'admin'){
        url.pathname = '/admin'
      } else {
        url.pathname = '/'
      }
      return NextResponse.redirect(url)
    }
  }

  // Blokir akses ke halaman admin panel dan lempar ke halaman Dashboard Admin (/) jika bukan admin
  if(pathname.startsWith('/admin')) {
    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

// Atur halaman yang dapat diakses (Matcher)
export const config = {
  matcher: [
    '/materi/:path*',
    '/admin/:path*'
  ],
}