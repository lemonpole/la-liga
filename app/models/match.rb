class Match < ActiveRecord::Base
	validates :group_num, :bracket_num, :bracket_round_num, :bracket_round_game_num, numericality:{ only_integer:true }, allow_blank: true
	
	# define many_to_many with matches
	belongs_to :tourney, inverse_of: :matches
end