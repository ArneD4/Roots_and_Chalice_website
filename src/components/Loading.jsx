import './Loading.css'

function Loading({ loading, error  }) {
    console.log(loading, error)

  if (error) {
    return <div className="loading">
        <p>Something went wrong: {error.message}</p>
    </div>;
  }

  return (
    <div className="loading">
      <img className="loading__image" src="/loading.gif" alt="loading" />
      <p>Loading...</p>
    </div>
  )
}

export default Loading
