<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    protected $table = "teams";
    protected $fillable = ['teams_group', 'teams_name', 'total_points', 'teams_gender'];

    public function matches(): BelongsToMany{
        return $this->belongsToMany(Matches::class, 'match_team', 'fk_id_teams','fk_id_matches');
    }

    public function players(): BelongsToMany{
        return $this->belongsToMany(Player::class, 'player_team', 'fk_id_teams', 'fk_id_players');
    }

    public function reports(): BelongsToMany{
        return $this->belongsToMany(Report::class, 'report_team', 'fk_id_teams', 'fk_id_reports');
    }
}
