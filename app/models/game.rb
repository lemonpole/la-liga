class Game < ActiveRecord::Base
	validates :name, presence: true, length: { maximum: 64 }
	validates :short_name, presence: true, length: { maximum: 16 }
	has_many :tourneys, inverse_of: :game
end