AppClasses.Views.ShowGuild = class extends Backbone.View {
	constructor(opts) {
		opts.events = {
			"submit #quitGuildForm": "quit",
			"submit #joinGuildForm": "join",
			"click .resToRequestGuild": "resToRequest",
			"click #warTimeFightRequest": "warTimeFightRequest",
			"click .officerToggle": "officerToggle",
			"click .kickUser": "kickUser"
		}
		super(opts);
		this.guild_id = opts.guild_id;
		this.tagName = "div";
		this.template = App.templates["guilds/show"];
		this.listenTo(this.model, "change reset add remove", this.updateRender);
		this.model.fetch();
		this.guild = null;
		this.updateRender();
	}
	kickUser(e) {
		const usrID = e.target.getElementsByClassName("nodisplay")[0].innerText;
		$("#officerIdField").attr("value", usrID);
		App.utils.formAjax(`/api/guild/kick.json`, "#officerToggleForm")
		.done(res => {
			App.toast.success(res.msg, { duration: 2000, style: App.toastStyle });
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
	}
	officerToggle(e) {
		const usrID = e.target.getElementsByClassName("nodisplay")[0].innerText;
		const action = e.target.getElementsByClassName("nodisplay")[1].innerText;
		$("#officerIdField").attr("value", usrID);
		App.utils.formAjax(`/api/guild/${action}.json`, "#officerToggleForm")
		.done(res => {
			App.toast.success(res.msg, { duration: 2000, style: App.toastStyle });
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
	}
	resToRequest(e) {
		e.preventDefault();
		const usrID = e.target.getElementsByClassName("nodisplay")[0].innerText;
		const action = e.target.getElementsByClassName("nodisplay")[1].innerText;
		$("#acceptRequestIDField").attr("value", usrID);
		App.utils.formAjax(`/api/guild/${action}.json`, "#acceptRequestForm")
		.done(res => {
			App.toast.success(res.msg, { duration: 2000, style: App.toastStyle });
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
		return (false);
	}
	quit(e) {
		e.preventDefault();
		App.utils.formAjax("/api/guild/quit.json", "#quitGuildForm")
		.done(res => {
			App.toast.success("You quitted your guild !", { duration: 2000, style: App.toastStyle });
			App.models.user.set("guild_id", null);
			App.models.user.set("guild_owner", false);
			App.models.user.set("guild_officer", false);
			App.models.user.set("guild_validated", false);
			location.hash = `#guilds`;
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
		return (false);
	}
	join(e) {
		e.preventDefault();
		App.utils.formAjax("/api/guild/join.json", "#joinGuildForm")
		.done(res => {
			App.toast.success("Request sent!", { duration: 2000, style: App.toastStyle });
			App.models.user.set("guild_id", this.guild_id);
			App.models.user.set("guild_owner", false);
			App.models.user.set("guild_officer", false);
			App.models.user.set("guild_validated", false);
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
		return (false);
	}
	warTimeFightRequest() {
		App.utils.formAjax("/api/wars/match_request.json", "#warTimeFightRequestForm")
		.done(res => {
			App.toast.success("Request sent!");
		})
		.fail((e) => {
			App.utils.toastError(e);
		});
	}
	getWars(guildJSON) {
		let wars = [];
		if (guildJSON) {
			wars = guildJSON.wars.map(war => {
				const warNotEnded = guildJSON.active_war && war.id === guildJSON.active_war.id;
				if (warNotEnded) {
					war.war_times = guildJSON.active_war.war_times;
					war.in_war_time = guildJSON.active_war.in_war_time;
					war.running = guildJSON.active_war.running;
				}
				const enemyID = war.guild1_id == guildJSON.id ? war.guild2_id : war.guild1_id;
				war.response_needed = false;
				if (war.match_request_guild == enemyID) {
					war.response_needed = true;
				}
				const enemyGuild = this.model.findWhere({id: enemyID});
				const enemyJSON = enemyGuild ? enemyGuild.toJSON() : null;
				war.not_started = warNotEnded && war.validated == war.guild1_id + war.guild2_id;
				war.planning = warNotEnded && !war.not_started;
				war.won = war.winner == guildJSON.id;
				war.you = guildJSON.name;
				if (war.guild1_id == guildJSON.id) {
					war.enemy_score = war.g2_score;
					war.your_score = war.g1_score;
				} else {
					war.enemy_score = war.g1_score;
					war.your_score = war.g2_score;
				}
				war.enemy = enemyJSON ? {name: enemyJSON.name, id: enemyID} : null;
				if (guildJSON.active_war && guildJSON.active_war.id === war.id) {
					guildJSON.active_war.not_started = war.not_started;
					guildJSON.active_war.planning = war.planning;
				}
				war.date = new Date(war.created_at);
				war.rawDate = war.date.valueOf();
				war.user_is_in_guild = App.models.user.isInGuild(this.guild);
				if (war.winner == -1) {
					war.draw = true;
				}
				return war;
			});
		}
		return (wars);
	}
	updateRender() {
		this.guild = this.model.findWhere({id: this.guild_id});
		const guildJSON = this.guild ? this.guild.toJSON() : null;
		const user = App.models.user;
		let wars = this.getWars(guildJSON);
		wars = wars.sort((a, b) => {
			return (b.rawDate - a.rawDate);
		});
		const officerRights = user.isOwner(this.guild) || user.isOfficer(this.guild) || user.toJSON().admin;
		this.$el.html(this.template({
			guild: guildJSON,
			owner: user.isOwner(this.guild),
			officerRights,
			isInGuild: user.isInGuild(this.guild),
			wars,
			token: $('meta[name="csrf-token"]').attr('content')
		}));
		return (this);
	}
	render(guild_id) {
		if (this.guild_id != guild_id) {
			this.guild_id = guild_id;
			this.updateRender();
		}
		this.model.fetch();
		this.delegateEvents();
		return (this);
	}
}
