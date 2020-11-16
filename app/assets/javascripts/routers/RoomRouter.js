AppClasses.Routers.RoomRouter = class extends AppClasses.Routers.AbstractRouter {
	constructor(options) {
		super(options);
		this.route("room", "index");
		this.route("room/new", "newRoom");
		this.route("rooms/:room_id", "showRoom");

		this.collections.rooms = new AppClasses.Collections.Room();

	}
    
	index() {
		const user = this.models.user;
		this.viewWithRenderParam("room", "Room", user, {
			model: this.collections.rooms,
			user
		});
	}

	newRoom() {
		// TODO : brancher à cable l'ajout d'une room
		this.basicView("newRoom", "NewRoom", {model: this.models.user});
	}

	showRoom(room_id) {

		const r_id = parseInt(room_id);
		const user = this.models.user;

		this.viewWithRenderParam("showRoom", "ShowRoom", r_id, {
			model: this.collections.rooms,
			room_id: r_id,
			user
		});
	}
	
}
