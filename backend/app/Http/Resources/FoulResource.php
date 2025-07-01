<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoulResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fk_id_players'=>$this->fk_id_players,
            'yellow_card'=>$this->yellow_card,
            'red_card'=>$this->red_card,
            'fouls_amount'=>$this->fouls_amount,
        ];
    }
}
