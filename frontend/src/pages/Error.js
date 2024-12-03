// ** React Imports
import { Link } from 'react-router-dom'

const Error = () => {

  return (
    <div className='misc-wrapper'>
      <div className='misc-inner p-2 p-sm-3'>
        <div className='w-100 text-center'>
          <h2 className='mb-1'>Page Not Found 🕵🏻‍♀️</h2>
          <p className='mb-2'>Oops! 😖 The requested URL was not found on this server.</p>
          <button tag={Link} to='/' style={{ backgroundColor: 'red'}} className='btn-sm-block mb-2'>
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}
export default Error
