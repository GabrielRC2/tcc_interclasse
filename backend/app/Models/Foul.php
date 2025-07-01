<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Foul extends Model
{
    protected $table = 'fouls';
    protected $fillable = ['yellow_card', 'red_card', 'fouls_amount', 'fk_id_players'];

    public function player(): BelongsTo {
        return $this->belongsTo(Player::class);
    }
}
