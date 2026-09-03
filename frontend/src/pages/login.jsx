import { assets } from '../assets/assets.js'
import { Star } from 'lucide-react';
import { SignIn } from '@clerk/react'
import { useEffect } from 'react'
import { useAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const { userId, isLoaded } = useAuth()
  const navigate = useNavigate()

  // Redirect to feed if user is already signed in
  useEffect(() => {
    if (isLoaded && userId) {
      navigate('/')
    }
  }, [userId, isLoaded, navigate])
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-white" style={{ backgroundImage: `url(${assets.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      {/* Left Section - Branding (Hidden on small screens) */}
      <div className="hidden md:flex flex-1 flex-col items-start justify-between p-6 md:p-10 lg:p-16">
        <img src={ assets.logo } alt="logo icon" className='h-10 md:h-12 object-contain' />

        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-3 mb-6">
            <img src={ assets.group_users } alt="users" className='h-8 object-contain' />
            <div>
              <div className='flex gap-1'>
                {Array(5).fill(0).map((_, i) => (<Star key={i} className="size-4 text-transparent fill-amber-500" />))}
              </div>
              <p className='text-sm text-gray-600 mt-1'>Used by 12K developers</p>
            </div>
          </div>
          <h1 className='text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent leading-tight'>Join the Future of More than just friends connect</h1>
          <p className='text-lg text-indigo-900 max-w-md mt-4'>Experience the next generation of AI-Powered conversations with our cutting-edge platform.</p>
        </div>
        <div></div>
      </div>

      {/* Right Section - Sign In Form (Full width on mobile) */}
      <div className='flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 min-h-screen md:min-h-auto'>
        {/* Mobile Header (Only visible on small screens) */}
        <div className='md:hidden w-full text-center mb-8'>
          <img src={ assets.logo } alt="logo icon" className='h-8 object-contain mx-auto mb-4' />
          <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent'>Join Our Community</h1>
        </div>
        
        {/* Clerk Sign In */}
        <div className='w-full max-w-md'>
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'w-full',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Login;
