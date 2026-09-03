import { useEffect } from "react"
import { dummyStoriesData } from "../assets/assets"

const StoriesBar = () => {

    const [stories, setStories] = useState([])

    const fetchStories = async () => {
        setStories(dummyStoriesData)
    }

    useEffect(() => {
        fetchStories()
    }, [])

  return (
    <div>
        
    </div>
  )
}

export default StoriesBar
