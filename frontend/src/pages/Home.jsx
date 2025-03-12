import React from 'react'
import { useSelector } from 'react-redux';

const Home = () => {
    const { user } = useSelector((state) => state.auth);
    // const dispatch = useDispatch();

    if(!user) return <p>Please login to enjoy Quotes.</p>;
  return (

    <div>Welcome {user.name}</div>
  )
}

export default Home