<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Matches extends Model
{
    protected $table = 'matches';

    public function reports(): BelongsTo{
        return $this->belongsTo(Report::class);
    }

    public function teams(): BelongsToMany{
        return $this->belongsToMany(Team::class,'match_team', 'fk_id_matches', 'fk_id_teams');
    }
}
