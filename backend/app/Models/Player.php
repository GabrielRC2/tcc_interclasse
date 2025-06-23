<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $table = 'players';

    public function fouls():HasMany {
        return $this->hasMany(Foul::class);
    }

    public function teams(): BelongsToMany{
        return $this->belongsToMany(Team::class, 'player_team', 'fk_id_players', 'fk_id_teams');
    }
}
