class FriendshipController < ApplicationController

	before_action :connect_user
	before_action :set_id, only: [:destroy, :add, :accept, :reject]
	before_action :check_in_friendlist, only: [:add, :accept]

	def destroy
		other_friendship = Friendship.where(user_id: @friend_id, friend_id: current_user.id).first
		if other_friendship
			other_friendship.destroy
		end
		user_friendship = Friendship.where(user_id: current_user.id, friend_id: @friend_id).first
		if user_friendship
			user_friendship.destroy
		end
		respond_to do |format|
			format.html { redirect_to guilds_url, notice: 'Friendship successfully destroyed.' }
			format.json { render json: {msg: "Friendship successfully destroyed"}, status: :ok }
		end
	end

	def add
		current_user.friendships.create({friend_id: @friend_id})
		respond_to do |format|
			format.html { redirect_to guilds_url, notice: 'Friend request sent.' }
			format.json { render json: {msg: "Friend request sent"}, status: :ok }
		end
	end

	def accept
		# get other user friendship and confirm it
		user_friendship = Friendship.where(user_id: @friend_id, friend_id: current_user.id).first
		if !user_friendship
			res_with_error("Bad request", :bad_request)
			return false
		end
		current_user.friendships.create({friend_id: @friend_id, confirmed: true})
		respond_to do |format|
			format.html { redirect_to guilds_url, notice: 'Friend request accepted.' }
			format.json { render json: {msg: "Friend request accepted"}, status: :ok }
		end
	end

	def reject
		other_friendship = Friendship.where(user_id: @friend_id, friend_id: current_user.id).first
		if !other_friendship
			res_with_error("Bad request", :bad_request)
			return false
		end
		other_friendship.destroy
		respond_to do |format|
			format.html { redirect_to guilds_url, notice: 'Friend request rejected.' }
			format.json { render json: {msg: "Friend request rejected"}, status: :ok }
		end
	end

	private

	def set_id
		@friend_id = params[:id]
	end

	def res_with_error(msg, error)
		respond_to do |format|
			format.html { redirect_to "/", alert: "#{msg}" }
			format.json { render json: {alert: "#{msg}"}, status: error }
		end
	end

	def check_in_friendlist
		if current_user.friendships.where(friend_id: @friend_id).exists?
			res_with_error("User already in your list", :bad_request)
			return false
		end
		return (true)
	end

	def connect_user
		unless user_signed_in?
			respond_to do |format|
				format.html { redirect_to "/", alert: "You need to be connected for this action" }
				format.json { render json: {alert: "You need to be connected for this action"}, status: :unprocessable_entity }
			end
		end
	end

end