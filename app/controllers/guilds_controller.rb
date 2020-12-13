class GuildsController < ApplicationController
  before_action :connect_user
  before_action :set_guild, only: [:show, :edit, :update, :destroy, :join]
  before_action :set_user, only: [:promote, :demote]
  before_action :officer_checks, only: [:promote, :demote]
  before_action :has_guild, only: [:new, :join]

  # GET /guilds
  # GET /guilds.json
  def index
    Guild.all.each do |guild|
      war = guild.active_war
      if war
        war.end_if_needed
      end
    end
    @guilds = Guild.all.map do |guild|
      Guild.clean(guild)
    end
    respond_to do |format|
			format.html { redirect_to "/", notice: ':)' }
			format.json { render json: @guilds, status: :ok }
		end
  end

  # GET /guilds/1
  # GET /guilds/1.json
  def show
  end

  # GET /guilds/new
  def new
    # needed to load default html.erb view, we can delete it later if we want
    # but it's not a big deal as it is not saved on the database
    @guild = Guild.new
  end

  # GET /guilds/1/edit
  def edit
  end

  # POST /guilds
  # POST /guilds.json
  def create
    g_params = guild_params()
    if (!g_params)
      return false # http response is in guild_params()
    end
    @guild = current_user.create_guild(g_params)
    unless @guild.id
      return res_with_error("Name or anagram already taken!", :unprocessable_entity)
    end
    current_user.guild_owner = true
    current_user.guild_validated = true
    current_user.save
    respond_to do |format|
      format.html { redirect_to @guild, notice: 'Guild was successfully created.' }
      format.json { render :show, status: :created, location: @guild }
    end
  end

  # PATCH/PUT /guilds/1
  # PATCH/PUT /guilds/1.json
  def update
    unless current_user.guild.owner == current_user
      return res_with_error("You need to own the guild to edit it", :unauthorized)
    end

    g_params = guild_params()
    if (!g_params)
      return false # http response is in guild_params()
    end
    
    unless @guild.update(g_params)
      return res_with_error("Name or anagram already taken!", :unprocessable_entity)
    end
    
    respond_to do |format|
      format.html { redirect_to @guild, notice: 'Guild was successfully updated.' }
      format.json { render :show, status: :ok, location: @guild }
    end
  end

  # DELETE /guilds/1
  # DELETE /guilds/1.json
  def destroy

    unless @guild.owner == current_user
      res_with_error("You can't destroy it if you don't own it!", :unauthorized)
      return
    end
    # remove all associations with this guild
    User.where("guild_id = #{@guild.id}").each do |user|
      User.reset_guild(user)
    end
    @guild.destroy
    respond_to do |format|
      format.html { redirect_to guilds_url, notice: 'Guild was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def quit
    if current_user.guild_owner
      @guild = current_user.guild
      destroy
      return true
    end
    User.reset_guild(current_user)
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds", reset: true
    respond_to do |format|
      format.html { redirect_to guilds_url, notice: 'You quitted your guild' }
      format.json { render json: User.clean(current_user), status: :ok }
    end
  end

  def join
    current_user.guild_id = @guild.id
    current_user.guild_officer = false
    current_user.guild_owner = false
    current_user.guild_validated = false
    current_user.save
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds"
    respond_to do |format|
      format.html { redirect_to guilds_url, notice: 'Joining request sent.' }
      format.json { render json: User.clean(current_user), status: :ok }
    end
  end

  def accept_request
    new_usr = User.find(params[:id]) rescue nil
    return res_with_error("User not found", :not_found) unless new_usr
    unless new_usr.guild_id == current_user.guild_id
      return res_with_error("Bad request", :bad_request)
    end
    unless current_user.has_officer_rights
      return res_with_error("Action unauthorized", :unauthorized)
    end
    new_usr.guild_validated = true
    new_usr.save
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds"
    success("Joining request accepted")
  end

  def reject_request
    new_usr = User.find(params[:id]) rescue nil
    return res_with_error("User not found", :not_found) unless new_usr
    unless new_usr.guild_id == current_user.guild_id
      return res_with_error("Bad request", :bad_request)
    end
    unless current_user.has_officer_rights
      return res_with_error("Action unauthorized", :unauthorized)
    end
    new_usr.guild = nil
    new_usr.save
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds"
    ActionCable.server.broadcast "update_channel", action: "update", target: "users"
    success("Request rejected")
  end

  def promote
    @user.guild_officer = true
    @user.save
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds"
    success("User promoted")
  end

  def demote
    @user.guild_officer = false
    @user.save
    ActionCable.server.broadcast "update_channel", action: "update", target: "guilds"
    success("User demoted")
  end

  private

    def officer_checks
      unless current_user.has_officer_rights
        return res_with_error("You need to have officer rights", :bad_request)
      end
      unless current_user.same_guild?(@user)
        return res_with_error("Guild IDs do not match", :bad_request)
      end
      if @user.guild_owner
        return res_with_error("You cannot promote/demote the guild owner")
      end
    end
  
    # Use callbacks to share common setup or constraints between actions.
    def set_guild
      @guild = Guild.find(params[:id]) rescue nil
      return res_with_error("Guild not found", :not_found) unless @guild
    end

    def set_user
      @user = User.find(params[:id]) rescue nil
      return res_with_error("User not found", :not_found) unless @user
    end

    # Only allow a list of trusted parameters through.
    # and verify if they are well formatted xd
    def guild_params
      g_params = params.require(:guild).permit(:name, :anagram)
      if !g_params['name'] || check_len(g_params['name'], 3, 20)
        return res_with_error("Name length must be >= 3 and <= 20", :bad_request)
      end
      if !g_params['anagram'] || check_len(g_params['anagram'], 2, 5)
        return res_with_error("Anagram length must be >= 2 and <= 5", :bad_request)
      end
      return (g_params)
    end

    def check_len(str, minlen, maxlen)
      if (str && str.length >= minlen && str.length <= maxlen)
        return false # no errors
      end
      return true # error
    end

    def has_guild
      if current_user.guild
        return res_with_error("You already are in a guild", :bad_request)
      end
    end
end
