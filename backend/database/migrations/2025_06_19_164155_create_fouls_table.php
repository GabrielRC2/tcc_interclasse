<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fouls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fk_id_players');
            $table->integer('yellow_card')->default(0);
            $table->integer('red_card')->default(0);
            $table->integer('fouls_amount')->default(0);
            $table->timestamps();

            $table->foreign('fk_id_players')->references('id')->on('players')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fouls');
    }
};
