import { Routes, Route } from 'react-router-dom'
import Login from './pages/login'
import Feed from './pages/feed'
import Message from './pages/message'
import Connection from './pages/connection'
import Discover from './pages/dicover'
import CreatePost from './pages/createpost'
import Layout from './pages/layout'
import Profile from './pages/profile'
import { useAuth } from '@clerk/react'

const App = () => {
  const { userId } = useAuth()

  return (
    <Routes>
      <Route path="/" element={!userId ? <Login /> : <Layout />}>
        <Route index element={<Feed />} />
        <Route path="message" element={<Message />} />
        <Route path="message/:userId" element={<Message />} />
        <Route path="connection" element={<Connection />} />
        <Route path="discover" element={<Discover />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
