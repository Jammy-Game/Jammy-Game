// ** Reducers Imports
import lobbyStore from '../pages/Lobby/store'
import joinStore from '../pages/Join/store'
import gameStore from '../pages/Game/store'
import rootStore from '../pages/store'

const rootReducer = {
  lobbyStore,
  joinStore,
  gameStore,
  rootStore
}

export default rootReducer