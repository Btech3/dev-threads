const loading = ({height = '100vh'}) => {
  return (
    <div>
      <div style={{height}} className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    </div>
  )
}

export default loading;
