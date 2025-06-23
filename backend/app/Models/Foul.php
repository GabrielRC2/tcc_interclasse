<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Foul extends Model
{
    protected $table = 'fouls';

    public function player(): BelongsTo {
        return $this->belongsTo(Player::class);
    }
}
